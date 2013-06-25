package com.softwaremill.codebrag.service.github.jgit

import com.softwaremill.codebrag.service.github.{RepoData, GitHubCommitsLoader}
import com.softwaremill.codebrag.domain.CommitInfo
import com.typesafe.scalalogging.slf4j.Logging
import scala.collection.JavaConversions._
import com.softwaremill.codebrag.dao.CommitInfoDAO
import org.eclipse.jgit.lib.ObjectId

class JgitGitHubCommitsLoader(jGitFacade: JgitFacade, internalDirTree: InternalGitDirTree, converter: JgitLogConverter, uriBuilder: RemoteGitUriBuilder,
                              commitInfoDao: CommitInfoDAO) extends GitHubCommitsLoader with Logging {

  def loadMissingCommits(repoData: RepoData): List[CommitInfo] = {

    val remotePath = uriBuilder.build(repoData)
    val localPath = internalDirTree.getPath(repoData)

    val logCommand = if (!internalDirTree.containsRepo(repoData))
      jGitFacade.clone(remotePath, localPath).log()
    else {
      val previousHead = fetchPreviousHead
      val git = jGitFacade.pull(localPath)
      val headAfterPull = jGitFacade.getHeadId(localPath)
      previousHead match {
        case Some(sha) => git.log.addRange(sha, headAfterPull)
        case None => {
          logger.warn("Incosistent repository state, cannot determine last commit in database. Rebuilding from local git log.")
          git.log
        }
      }
    }
    converter.toCommitInfos(logCommand.call().toList, logCommand.getRepository)
  }

  def fetchPreviousHead: Option[ObjectId] = {
    commitInfoDao.findLastSha().map(ObjectId.fromString(_))
  }

}